FROM python:3.8
WORKDIR /app
COPY requirements.txt /app
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000

# If not use docker-composer: 

#CMD [ "python", "./manage.py", "runserver", "0.0.0.0:8000"]


# docker build -t drivejan .
# docker run -d -p 8000:8000 drivejan
